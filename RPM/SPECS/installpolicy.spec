# This is a sample spec file for wget
 
%define _topdir     /root/WebstormProjects/LX-ASM/RPM
%define name        install-policy
%define release     1
%define version     1.12
%define buildroot %{_topdir}/%{name}-%{version}-root
 
BuildRoot:  %{buildroot}
Summary:        GNU wget
License:        GPL
Name:           %{name}
Version:        %{version}
Release:        %{release}
Source:         %{name}-%{version}.tar.gz
Prefix:         /usr
Group:          Development/Tools
 
%description
The GNU wget program downloads files from the Internet using the command-line.
 
%prep
%setup -q
 
%build
./configure
make
 
%install
make install prefix=$RPM_BUILD_ROOT/usr
 
%files
%defattr(-,root,root)
/usr/local/bin/wget
 
%doc %attr(0444,root,root) /usr/local/share/man/man1/installpolicy.1
